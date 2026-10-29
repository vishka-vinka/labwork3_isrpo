import * as vscode from 'vscode';
import * as path from 'path';

// Интерфейс нашей заметки
export interface NoteData {
    text: string;
    type: 'global' | 'file';
    filePath?: string;
    lineNumber?: number;
}

// Элемент дерева (заметка)
export class NoteItem extends vscode.TreeItem {
    constructor(public readonly data: NoteData) {
        super(data.text, vscode.TreeItemCollapsibleState.None);
        
        // Если заметка привязана к файлу, добавляем иконку и команду перехода
        if (data.type === 'file' && data.filePath) {
            this.iconPath = new vscode.ThemeIcon('symbol-file');
            this.description = `${path.basename(data.filePath)}:${(data.lineNumber || 0) + 1}`;
            this.command = {
                command: 'vscode.open',
                title: 'Открыть файл',
                arguments: [
                    vscode.Uri.file(data.filePath),
                    { selection: new vscode.Range(data.lineNumber!, 0, data.lineNumber!, 0) }
                ]
            };
        } else {
            this.iconPath = new vscode.ThemeIcon('book'); // Иконка для общих заметок
        }
    }
}

export class NotesProvider implements vscode.TreeDataProvider<any> {
    private _onDidChangeTreeData = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private notes: NoteData[] = [];
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.notes = this.context.globalState.get<NoteData[]>('myNotes', []);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(null);
    }

    addNote(note: NoteData) {
        this.notes.push(note);
        this.save();
    }

    deleteNote(noteToDelete: NoteData) {
        // Оставляем все заметки, КРОМЕ той, которую хотим удалить
        this.notes = this.notes.filter(n => 
            !(n.text === noteToDelete.text && 
              n.type === noteToDelete.type && 
              n.lineNumber === noteToDelete.lineNumber)
        );
        this.save(); // Сохраняем обновленный список
    }

    private save() {
        this.context.globalState.update('myNotes', this.notes);
        this.refresh();
    }

    exportToJson() {
        const json = JSON.stringify(this.notes, null, 2);
        vscode.workspace.openTextDocument({ content: json, language: 'json' }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    // Возвращает элементы для боковой панели (Группировка)
    getChildren(element?: any): Thenable<any[]> {
        if (!element) {
            // Верхний уровень: две группы
            return Promise.resolve([
                { label: 'Общие заметки', type: 'group', group: 'global' },
                { label: 'Заметки в файлах', type: 'group', group: 'file' }
            ]);
        } else if (element.type === 'group') {
            // Нижний уровень: сами заметки из нужной группы
            const filtered = this.notes.filter(n => n.type === element.group);
            return Promise.resolve(filtered.map(n => new NoteItem(n)));
        }
        return Promise.resolve([]);
    }

    // Как отрисовывать элемент
        getTreeItem(element: any): vscode.TreeItem {
        // Если это наша заметка (класс NoteItem), возвращаем её как есть
        if (element instanceof NoteItem) {
            return element;
        }

        // Если это группа (папка)
        const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.Expanded);
        item.iconPath = new vscode.ThemeIcon('repo');
        return item;
    }
}
