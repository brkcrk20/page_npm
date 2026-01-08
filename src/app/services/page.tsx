import {
  Stethoscope,
  Building,
  Medal,
  Scissors,
  Car,
  Phone,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { services } from "@/lib/data";
import { ReactNode } from 'react';

const serviceIcons: { [key: string]: ReactNode } = {
  Veterinarian: <Stethoscope />,
  'Pet Hotel': <Building />,
  Trainer: <Medal />,
  Groomer: <Scissors />,
  'Pet Taxi': <Car />,
  Petshop: <ShoppingCart />,
};

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Evcil Hayvan Hizmetleri</h1>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
          Dostlarınızın tüm ihtiyaçları için profesyonel hizmetler.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <div className="w-12 h-12 flex-shrink-0 text-primary [&>svg]:w-full [&>svg]:h-full">
                {serviceIcons[service.type]}
              </div>
              <div>
                <CardTitle className="font-headline">{service.name}</CardTitle>
                <CardDescription>{service.type}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{service.location}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mr-2" />
                <span>{service.contact}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
