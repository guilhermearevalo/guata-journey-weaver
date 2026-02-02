import { KanbanBoard } from '@/components/admin/KanbanBoard';

const AdminDemandas = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Demandas</h1>
        <p className="text-muted-foreground">
          Pipeline de solicitações de viagem
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
};

export default AdminDemandas;
