import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

interface ExperienceItineraryProps {
  itinerary: ItineraryDay[];
}

export function ExperienceItinerary({ itinerary }: ExperienceItineraryProps) {
  if (itinerary.length === 0) {
    return (
      <p className="text-muted-foreground">
        Itinerário detalhado será disponibilizado após a confirmação.
      </p>
    );
  }

  return (
    <Accordion type="single" collapsible defaultValue="day-1" className="w-full">
      {itinerary.map((day, index) => (
        <AccordionItem key={index} value={`day-${day.day}`}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-4 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {day.day}
              </span>
              <span className="font-display text-lg font-semibold">
                {day.title}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pl-14">
            <p className="whitespace-pre-line text-muted-foreground">
              {day.description}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
