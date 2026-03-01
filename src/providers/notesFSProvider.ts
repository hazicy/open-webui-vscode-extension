  import * as vscode from 'vscode';

  type Entry = FileEntry | DirectoryEntry;

  interface FileEntry {
    type: vscode.FileType.File;
    ctime: number;
    mtime: number;
    size: number;
    content: Uint8Array;
  }

  interface DirectoryEntry {
    type: vscode.FileType.Directory;
    ctime: number;
    mtime: number;
    entries: Map<string, Entry>;
  }

  export class NotesFSProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
      this._emitter.event;
    private root: DirectoryEntry;

    constructor() {
      this.root = {
        type: vscode.FileType.Directory,
        ctime: Date.now(),
        mtime: Date.now(),
        entries: new Map(),
      };
    }

    watch(
      uri: vscode.Uri,
      options: {
        readonly recursive: boolean;
        readonly excludes: readonly string[];
      },
    ): vscode.Disposable {
      // Return a disposable that does nothing
      return { dispose: () => {} };
    }

    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
      const entry = this.lookup(uri.path);

      return {
        type: entry.type,
        ctime: entry.ctime,
        mtime: entry.mtime,
        size: entry.type === vscode.FileType.File ? entry.size : 0,
      };
    }
    readDirectory(
      uri: vscode.Uri,
    ): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
      const path = uri.path;
      const entry = this.lookup(path);

      if (entry.type !== vscode.FileType.Directory) {
        throw vscode.FileSystemError.FileNotADirectory();
      }

      return Array.from(entry.entries.entries()).map(([name, entry]) => [
        name,
        entry.type,
      ]);
    }

    createDirectory(uri: vscode.Uri): void | Thenable<void> {
      const path = uri.path;
      const basename = this.getBasename(path);
      const parentEntry = this.lookupParentDirectory(path);

      parentEntry.entries.set(basename, {
        type: vscode.FileType.Directory,
        ctime: Date.now(),
        mtime: Date.now(),
        entries: new Map(),
      });

      this._emitter.fire([
        {
          type: vscode.FileChangeType.Created,
          uri,
        },
      ]);
    }

    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
      const entry = this.lookup(uri.path);

      if (entry.type === vscode.FileType.Directory) {
        throw vscode.FileSystemError.FileIsADirectory();
      }

      return entry.content;
    }

    writeFile(
      uri: vscode.Uri,
      content: Uint8Array,
      options: { readonly create: boolean; readonly overwrite: boolean },
    ): void | Thenable<void> {
      const path = uri.path;
      const basename = this.getBasename(path);

      // Get or create parent directory
      let parentEntry: DirectoryEntry;
      try {
        parentEntry = this.lookupParentDirectory(path);
      } catch (error) {
        // If parent doesn't exist and create option is true, create it
        if (options.create) {
          const parentPath = this.getParentPath(path);
          this.createDirectory(vscode.Uri.parse(uri.scheme + '://' + parentPath));
          parentEntry = this.lookupParentDirectory(path);
        } else {
          throw error;
        }
      }

      // Check if file already exists
      const existingEntry = parentEntry.entries.get(basename);
      if (existingEntry && existingEntry.type === vscode.FileType.File) {
        if (!options.overwrite) {
          throw vscode.FileSystemError.FileExists();
        }
      } else if (!existingEntry && !options.create) {
        throw vscode.FileSystemError.FileNotFound();
      }

      parentEntry.entries.set(basename, {
        type: vscode.FileType.File,
        ctime: existingEntry?.ctime ?? Date.now(),
        mtime: Date.now(),
        size: content.byteLength,
        content,
      });

      // Trigger file change event
      this._emitter.fire([
        {
          type: existingEntry
            ? vscode.FileChangeType.Changed
            : vscode.FileChangeType.Created,
          uri,
        },
      ]);
    }

    delete(
      uri: vscode.Uri,
      options: { readonly recursive: boolean },
    ): void | Thenable<void> {
      const path = uri.path;
      const basename = this.getBasename(path);

      const parentEntry = this.lookupParentDirectory(path);

      parentEntry.entries.delete(basename);

      // Trigger file change event
      this._emitter.fire([
        {
          type: vscode.FileChangeType.Deleted,
          uri,
        },
      ]);
    }

    rename(
      oldUri: vscode.Uri,
      newUri: vscode.Uri,
      options: { readonly overwrite: boolean },
    ): void | Thenable<void> {
      const oldPath = oldUri.path;
      const oldBasename = this.getBasename(oldPath);
      const oldEntry = this.lookup(oldPath);

      const newPath = newUri.path;
      const newBasename = this.getBasename(newPath);
      const newParentEntry = this.lookupParentDirectory(newPath);

      // Check if target already exists
      const existingEntry = newParentEntry.entries.get(newBasename);
      if (existingEntry && !options.overwrite) {
        throw vscode.FileSystemError.FileExists();
      }

      // Remove from old location
      const oldParentEntry = this.lookupParentDirectory(oldPath);
      oldParentEntry.entries.delete(oldBasename);

      // Add to new location
      newParentEntry.entries.set(newBasename, oldEntry);

      // Trigger file change events
      this._emitter.fire([
        {
          type: vscode.FileChangeType.Deleted,
          uri: oldUri,
        },
        {
          type: vscode.FileChangeType.Created,
          uri: newUri,
        },
      ]);
    }

    copy?(
      source: vscode.Uri,
      destination: vscode.Uri,
      options: { readonly overwrite: boolean },
    ): void | Thenable<void> {
      const sourceEntry = this.lookup(source.path);
      if (sourceEntry.type === vscode.FileType.Directory) {
        throw vscode.FileSystemError.FileIsADirectory();
      }

      // Check if destination already exists
      try {
        const destEntry = this.lookup(destination.path);
        if (!options.overwrite) {
          throw vscode.FileSystemError.FileExists();
        }
      } catch (error) {
        // Destination doesn't exist, which is fine for copy
        if (error instanceof Error && error.message.includes('FileNotFound')) {
          // Continue
        } else {
          throw error;
        }
      }

      this.writeFile(destination, sourceEntry.content, {
        create: true,
        overwrite: options.overwrite,
      });
    }

    //
    private getBasename(path: string): string {
      const parts = path.split('/').filter((part) => part.length > 0);
      return parts[parts.length - 1] || '';
    }

    private getParentPath(path: string): string {
      const parts = path.split('/').filter((part) => part.length > 0);
      parts.pop(); // Remove last element (basename)
      return parts.length > 0 ? '/' + parts.join('/') : '/';
    }

    private lookup(path: string): Entry {
      const parts = path.split('/').filter((part) => part.length > 0);
      let entry: Entry = this.root;

      for (const part of parts) {
        if (entry.type !== vscode.FileType.Directory) {
          throw vscode.FileSystemError.FileNotADirectory();
        }

        const subEntry = entry.entries.get(part);

        if (!subEntry) {
          throw vscode.FileSystemError.FileNotFound();
        }

        entry = subEntry;
      }

      return entry;
    }

    private lookupParentDirectory(path: string): DirectoryEntry {
      const parts = path.split('/').filter((part) => part.length > 0);

      // If only one part (file at root), return root
      if (parts.length <= 1) {
        return this.root;
      }

      let entry: DirectoryEntry = this.root;

      for (let i = 0; i < parts.length - 1; i++) {
        if (entry.type !== vscode.FileType.Directory) {
          throw vscode.FileSystemError.FileNotADirectory();
        }

        const subEntry = entry.entries.get(parts[i]);

        if (!subEntry) {
          throw vscode.FileSystemError.FileNotFound();
        }

        if (subEntry.type !== vscode.FileType.Directory) {
          throw vscode.FileSystemError.FileNotADirectory();
        }

        entry = subEntry;
      }

      if (entry.type !== vscode.FileType.Directory) {
        throw vscode.FileSystemError.FileNotADirectory();
      }

      return entry;
    }
  }
