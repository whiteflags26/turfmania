"use client";
import { ITurf } from "@/types/turf";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/Button";
import {
  MapPin,
  Volleyball,
  Users,
  Clock,
  Building2,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface TurfDetailsProps {
  turf: ITurf;
}

export default function TurfDetails({ turf }: TurfDetailsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <Card className="overflow-hidden border-slate-200 hover:border-green-600 transition-all shadow-sm hover:shadow-xl hover:shadow-green-100">
        <CardContent className="p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <h2 className="text-2xl  text-slate-800">
              {turf.name}
            </h2>
            <span className="flex items-center text-slate-700 text-lg">
              <Building2 className="h-5 w-5 mr-2" />
              <a href="#" className="hover:text-green-600 transition-colors">
                {turf.organization.name}
              </a>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-600 text-base">
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <span>{turf.organization?.location?.address || "Address Unavailable"}</span>
            <Button className="text-sm ml-auto">View On Map</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-lg text-slate-700">
            <div className="flex items-center">
              <span className="mr-2 text-2xl font-extrabold text-green-600">৳</span>
              <span>Base Price:</span>
              <span className="ml-2 text-green-600 font-bold">
                {turf.basePrice.toFixed(2)}
                <span className="text-base text-slate-500 font-normal"> /hour</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Volleyball className="h-6 w-6 flex-shrink-0" />
              <span>Sports:</span>
              <div className="flex flex-wrap gap-2 ml-2">
                {turf.sports.map((sport) => (
                  <Badge
                    key={sport}
                    variant="secondary"
                    className="bg-green-50 text-green-700 text-sm px-2 py-1 rounded-md"
                  >
                    {sport}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              <span>Team Size:</span>
              <span className="ml-2 font-semibold">
                {turf.team_size}v{turf.team_size}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className=" mb-4 flex items-center text-slate-800 text-xl">
              <Clock className="h-5 w-5 mr-2" /> Operating Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base text-slate-700">
              {turf.operatingHours.map((hour, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="font-semibold w-24">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][hour.day]}:
                  </span>
                  <span className="font-mono tracking-wide">{hour.open} - {hour.close}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className=" mb-4 flex items-center text-slate-800 text-xl">
              <CheckCircle className="h-5 w-5 mr-2" /> Facilities
            </h3>
            {turf.organization?.facilities && turf.organization.facilities.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {turf.organization.facilities.map((facility) => (
                  <Badge
                    key={facility}
                    variant="outline"
                    className="border-green-300 text-slate-700 text-sm hover:bg-green-50 px-3 py-1 rounded-full transition"
                  >
                    {facility}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-base text-slate-500">No facilities listed.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
