import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, FileCheck } from 'lucide-react';

interface DocumentItem {
  name: string;
  checked: boolean;
  notes?: string;
}

interface DocumentsChecklistProps {
  items: DocumentItem[];
  onChange: (items: DocumentItem[]) => void;
  readOnly?: boolean;
}

export default function DocumentsChecklist({ items, onChange, readOnly = false }: DocumentsChecklistProps) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (!newItem.trim()) return;
    onChange([...items, { name: newItem.trim(), checked: false }]);
    setNewItem('');
  };

  const toggleItem = (idx: number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], checked: !updated[idx].checked };
    onChange(updated);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Documentos Necessários
          </CardTitle>
          {items.length > 0 && (
            <span className="text-sm text-muted-foreground">{checkedCount}/{items.length} conferidos</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && readOnly && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento listado.</p>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-lg border p-3">
            {!readOnly ? (
              <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(idx)} />
            ) : (
              <Checkbox checked={item.checked} disabled />
            )}
            <span className={`flex-1 text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
              {item.name}
            </span>
            {!readOnly && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {!readOnly && (
          <div className="flex gap-2 print:hidden">
            <Input
              placeholder="Ex: Passaporte válido"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <Button variant="outline" size="sm" onClick={addItem} disabled={!newItem.trim()}>
              <Plus className="mr-1 h-4 w-4" />Adicionar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
