import ItineraryPlanner from '@/components/itinerary/ItineraryPlanner';
import { useParams } from 'react-router-dom';

export default function PartnerRoteiro() {
  const { id } = useParams<{ id: string }>();
  return <ItineraryPlanner backLink="/partner/demandas" backLabel="Voltar para Demandas" />;
}
