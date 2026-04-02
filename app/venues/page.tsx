"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Venue } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/venues");
        const data = await res.json();
        setVenues(data);
      } catch (error) {
        console.error("Failed to load venues:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-foreground mb-8">Sân Đấu</h1>

          <div className="grid md:grid-cols-2 gap-8">
            {venues.map((venue) => (
              <Card key={venue.id} className="border-border overflow-hidden">
                <CardContent className="p-0">
                  {/* Map placeholder */}
                  {venue.lat != null && venue.lng != null && (
                    <iframe
                      title={`Bản đồ ${venue.name}`}
                      width="100%"
                      height="300"
                      src={`https://www.google.com/maps?q=${venue.lat},${venue.lng}&z=16&hl=vi&output=embed`}
                      style={{ border: 0 }}
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      loading="lazy"
                    />
                  )}

                  <div className="p-6">
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      {venue.name}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {venue.address}
                    </p>

                    {venue.lat && venue.lng && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Tọa độ: {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {venues.length === 0 && (
            <Card className="border-border">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Không có sân đấu nào</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
