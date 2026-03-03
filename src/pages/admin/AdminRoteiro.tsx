import ItineraryPlanner from '@/components/itinerary/ItineraryPlanner';
import { useParams } from 'react-router-dom';

export default function AdminRoteiro() {
  const { id } = useParams<{ id: string }>();
  return <ItineraryPlanner backLink="/admin/demandas" backLabel="Voltar para Demandas" />;
}
