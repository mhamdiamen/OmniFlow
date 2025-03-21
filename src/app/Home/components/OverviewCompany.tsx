import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function OverviewCompany() {
  const currentUser = useQuery(api.users.CurrentUser);
  const userCompany = useQuery(api.queries.company.getCompanyByOwner);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">New packages</p>
              <h3 className="text-2xl font-bold mt-1">222</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Ready for shipping</p>
              <h3 className="text-2xl font-bold mt-1">60</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">In transit</p>
              <h3 className="text-2xl font-bold mt-1">2 000</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <h3 className="text-2xl font-bold mt-1">3 600</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Delayed delivery */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Delayed delivery</h3>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              Show all
            </Button>
          </div>
          
          <div className="border-b pb-2 mb-2">
            <div className="grid grid-cols-4 text-xs text-muted-foreground">
              <div>Destination</div>
              <div>Truck</div>
              <div>Time arrive</div>
              <div>Time delay</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-4 text-sm">
              <div>Valencia - Barcelona</div>
              <div>KL5432L</div>
              <div>07:00 AM</div>
              <div>+20m</div>
            </div>
            <div className="grid grid-cols-4 text-sm">
              <div>Cordoba - Barcelona</div>
              <div>BL9837F</div>
              <div>07:30 AM</div>
              <div>+35m</div>
            </div>
            <div className="grid grid-cols-4 text-sm">
              <div>Sevilla - Barcelona</div>
              <div>RA3432J</div>
              <div>11:00 AM</div>
              <div>+20m</div>
            </div>
          </div>
        </Card>

        {/* Daily plan */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-medium">Daily plan</h3>
              <p className="text-xs text-muted-foreground">Wed 15 Jun</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-1">Shipments processed</p>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">1 080 / 2 000</p>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm mb-1">Orders processed</p>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">600 / 1 300</p>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm mb-1">Requests completed</p>
              <div className="flex justify-between">
                <p className="text-sm font-medium">12 / 20</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Available trucks */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Available trucks</h3>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              Show all
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">KL5323J</p>
                <p className="text-xs text-muted-foreground">Barcelona - Valencia</p>
              </div>
              <div className="text-sm">08:00h ↓</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">SR9012K</p>
                <p className="text-xs text-muted-foreground">Barcelona - Sevilla</p>
              </div>
              <div className="text-sm">09:30h ↓</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">SA2342A</p>
                <p className="text-xs text-muted-foreground">Barcelona - Sevilla</p>
              </div>
              <div className="text-sm">20:30h ↓</div>
            </div>
          </div>
        </Card>

        {/* Recent requests */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Recent requests</h3>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              Show all
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded"></div>
                <div>
                  <p className="text-sm font-medium">Delivery delay</p>
                  <p className="text-xs text-muted-foreground">Destination Valencia - Barcelona</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">1 min ago</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded"></div>
                <div>
                  <p className="text-sm font-medium">Packing problem</p>
                  <p className="text-xs text-muted-foreground">Destination Barcelona - Sevilla</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">10 min ago</div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-100 rounded"></div>
                <div>
                  <p className="text-sm font-medium">Machine breakdown</p>
                  <p className="text-xs text-muted-foreground">Destination Barcelona - Valencia</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">20 min ago</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}