import ItineraryPlanner from '@/components/itinerary/ItineraryPlanner';
import { useParams } from 'react-router-dom';

export default function ClienteRoteiro() {
  const { id } = useParams<{ id: string }>();
  return <ItineraryPlanner backLink={`/minha-conta/viagem/${id}`} backLabel="Voltar para Viagem" />;
}
