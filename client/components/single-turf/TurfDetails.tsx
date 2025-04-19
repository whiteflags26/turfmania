import { ITurf } from "@/types/turf";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Volleyball,
  Users,
  Clock,
  DollarSign,
  Building2,
  CheckCircle,
} from "lucide-react";

interface TurfDetailsProps {
  turf: ITurf;
}

export default function TurfDetails({ turf }: TurfDetailsProps) {
  return (
    <div
      className="space-y-6"
      
    >
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{turf.name}</h2>
            <span className="flex items-center text-gray-600">
              <Building2 className="h-4 w-4 mr-2 text-primary" />
              <a href="#" className="hover:underline text-primary">
                {turf.organization.name}
              </a>
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{turf.organization?.location?.address || "Address Unavailable"}</span>
            <a
              href="#"
              className="ml-2 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
            >
              View on Map
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center text-gray-800">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              <span className="font-medium">Base Price:</span>
              <span className="ml-1">৳{turf.basePrice.toFixed(2)}/hour</span>
            </div>

            <div className="flex items-center text-gray-800">
              <Volleyball className="h-5 w-5 mr-2 text-primary" />
              <span className="font-medium">Sports:</span>
              <div className="ml-1 flex flex-wrap gap-1">
                {turf.sports.map((sport) => (
                  <Badge variant="secondary" key={sport}>
                    {sport}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center text-gray-800">
              <Users className="h-5 w-5 mr-2 text-primary" />
              <span className="font-medium">Team Size:</span>
              <span className="ml-1">
                {turf.team_size} v {turf.team_size}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" /> Operating Hours:
            </h3>
            <ul className="list-disc ml-6 text-sm text-gray-700">
              {turf.operatingHours.map((hour, index) => (
                <li key={index}>
                  {
                    [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ][hour.day]
                  }
                  : {hour.open} - {hour.close}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-primary" /> Organization
              Facilities:
            </h3>
            {turf.organization?.facilities && turf.organization.facilities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {turf.organization.facilities.map((facility) => (
                  <Badge variant="outline" key={facility}>
                    {facility}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No facilities listed.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
