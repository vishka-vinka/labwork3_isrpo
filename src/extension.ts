import * as vscode from 'vscode';
import { NotesProvider } from './notesProvider';

export function activate(context: vscode.ExtensionContext) {
    const notesProvider = new NotesProvider(context);
    
    vscode.window.registerTreeDataProvider('notesView', notesProvider);

    // 1. Команда: Добавить ОБЩУЮ заметку (с кнопки "+" на панели)
    let addGlobal = vscode.commands.registerCommand('Notes.addGlobalNote', async () => {
        const text = await vscode.window.showInputBox({ prompt: 'Текст общей заметки' });
        if (text) {
            notesProvider.addNote({ text, type: 'global' });
        }
    });

    // 2. Команда: Добавить заметку к коду (через ПКМ)
    let addCode = vscode.commands.registerCommand('Notes.addCodeNote', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const text = await vscode.window.showInputBox({ prompt: 'Текст заметки для этой строки' });
        if (text) {
            const selection = editor.selection;
            // Сохраняем путь к файлу и номер строки (0-индексация)
            notesProvider.addNote({
                text,
                type: 'file',
                filePath: editor.document.fileName,
                lineNumber: selection.active.line
            });
        }
    });

    // 3. Команда: Экспорт (кнопка на панели)
    let exportCmd = vscode.commands.registerCommand('Notes.exportNotes', () => {
        notesProvider.exportToJson();
    });

     // 4. Команда: Удалить заметку
    let deleteCmd = vscode.commands.registerCommand('Notes.deleteNote', (item: any) => {
        // item.data — это наша заметка (объект NoteData), которая передается из TreeView
        if (item && item.data) {
            notesProvider.deleteNote(item.data);
        }
    });

    context.subscriptions.push(addGlobal, addCode, exportCmd, deleteCmd);
}

export function deactivate() {}