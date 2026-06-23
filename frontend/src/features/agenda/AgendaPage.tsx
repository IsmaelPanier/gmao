import React, { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { EventDropArg } from "@fullcalendar/core";

export default function AgendaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["interventions"],
    queryFn: async () => {
      const { data } = await api.get("/api/interventions?limit=500");
      return data;
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (args: { id: string; scheduledDate: string; scheduledTime: string }) =>
      api.patch(`/api/interventions/${args.id}`, {
        scheduledDate: args.scheduledDate,
        scheduledTime: args.scheduledTime,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interventions"] });
      toast.success("Agenda mis à jour");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la mise à jour");
    },
  });

  const getEventColor = (status: string) => {
    switch (status) {
      case "created": return "#64748b";
      case "assigned": return "#3b82f6";
      case "in_progress": return "#eab308";
      case "waiting": return "#f97316";
      case "completed": return "#22c55e";
      case "cancelled": return "#ef4444";
      default: return "#64748b";
    }
  };

  const events = data?.data?.filter((i: any) => i.scheduledDate).map((i: any) => {
    const date = new Date(i.scheduledDate);
    if (i.scheduledTime) {
      const [hours, minutes] = i.scheduledTime.split(":");
      date.setHours(parseInt(hours), parseInt(minutes), 0);
    }
    
    // Estimate end time if we have duration
    const endDate = new Date(date);
    if (i.durationEstimated) {
      endDate.setMinutes(endDate.getMinutes() + i.durationEstimated);
    } else {
      endDate.setHours(endDate.getHours() + 2); // Default 2 hours block
    }

    return {
      id: i.id,
      title: `${i.number} - ${i.client.lastName}`,
      start: date,
      end: endDate,
      backgroundColor: getEventColor(i.status),
      borderColor: getEventColor(i.status),
      extendedProps: {
        status: i.status,
      },
    };
  }) || [];

  const handleEventDrop = (arg: EventDropArg) => {
    if (!arg.event.start) return;
    const dateStr = arg.event.start.toISOString();
    const timeStr = `${arg.event.start.getHours().toString().padStart(2, "0")}:${arg.event.start.getMinutes().toString().padStart(2, "0")}`;
    
    updateScheduleMutation.mutate({
      id: arg.event.id,
      scheduledDate: dateStr,
      scheduledTime: timeStr,
    });
  };

  const handleEventClick = (arg: any) => {
    navigate(`/interventions/${arg.event.id}`);
  };

  return (
    <div className="space-y-8 animate-fade-in h-full flex flex-col">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
          <CalendarIcon className="w-4 h-4" /> Planification
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Agenda des Interventions</h1>
      </div>

      <Card className="flex-1 p-4 min-h-[600px] overflow-hidden bg-background">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="h-full calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              locale="fr"
              events={events}
              editable={true}
              droppable={true}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              height="100%"
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6],
                startTime: "08:00",
                endTime: "18:00",
              }}
              nowIndicator={true}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
