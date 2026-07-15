import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Users, Zap, Target, TrendingDown, Download, Info, Circle } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  avatarFallback: string;
  lastSubmission: string;
  efficiencyScore: number;
  tasks: {
    rejected: number;
    approved: number;
  };
}

const teamData: TeamMember[] = [
  { id: '1', name: 'Alice Johnson', role: 'Seal Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', avatarFallback: 'AJ', lastSubmission: '2024-07-29', efficiencyScore: 92, tasks: { rejected: 1, approved: 49 } },
  { id: '2', name: 'Bob Williams', role: 'Senior Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', avatarFallback: 'BW', lastSubmission: '2024-07-27', efficiencyScore: 88, tasks: { rejected: 2, approved: 38 } },
  { id: '3', name: 'Charlie Brown', role: 'Seal Processor', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', avatarFallback: 'CB', lastSubmission: '2024-07-28', efficiencyScore: 87, tasks: { rejected: 3, approved: 52 } },
  { id: '4', name: 'Diana Smith', role: 'Seal Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026707a', avatarFallback: 'DS', lastSubmission: '2024-07-28', efficiencyScore: 90, tasks: { rejected: 4, approved: 60 } },
  { id: '5', name: 'Eve Davis', role: 'Seal Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026708b', avatarFallback: 'ED', lastSubmission: '2024-07-28', efficiencyScore: 95, tasks: { rejected: 1, approved: 55 } },
  { id: '6', name: 'Frank Miller', role: 'Seal Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026709c', avatarFallback: 'FM', lastSubmission: '2024-07-26', efficiencyScore: 82, tasks: { rejected: 3, approved: 28 } },
  { id: '7', name: 'Grace Taylor', role: 'Senior Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e2902670ad', avatarFallback: 'GT', lastSubmission: '2024-07-27', efficiencyScore: 91, tasks: { rejected: 1, approved: 40 } },
  { id: '8', name: 'Henry Moore', role: 'Seal Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e2902670be', avatarFallback: 'HM', lastSubmission: '2024-07-29', efficiencyScore: 93, tasks: { rejected: 2, approved: 58 } },
  { id: '9', name: 'Ivy Harris', role: 'Seal Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e2902670cf', avatarFallback: 'IH', lastSubmission: '2024-07-27', efficiencyScore: 89, tasks: { rejected: 2, approved: 35 } },
  { id: '10', name: 'Jack King', role: 'Seal Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e2902670dg', avatarFallback: 'JK', lastSubmission: '2024-07-28', efficiencyScore: 85, tasks: { rejected: 5, approved: 50 } },
  { id: '11', name: 'Karen Lee', role: 'Seal Processor', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e2902670eh', avatarFallback: 'KL', lastSubmission: '2024-07-29', efficiencyScore: 94, tasks: { rejected: 1, approved: 48 } },
  { id: '12', name: 'Leo Young', role: 'Seal Specialist', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e2902670fi', avatarFallback: 'LY', lastSubmission: '2024-07-29', efficiencyScore: 86, tasks: { rejected: 3, approved: 42 } },
];

const StatBlock = ({ icon: Icon, title, value, description }: { icon: React.ElementType, title: string, value: string, description: string }) => (
    <div className="flex flex-col space-y-1.5 flex-1 px-6">
        <div className="flex items-center text-sm font-medium text-muted-foreground">
            <Icon className="h-4 w-4 mr-2" />
            {title}
        </div>
        <div className="text-4xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
    </div>
);


export default function TeamPerformanceDashboard() {
  return (
    <div className="bg-gray-50/50 min-h-screen w-full p-4 md:p-8">
      <div className="max-w-screen-xl mx-auto space-y-6">
       
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Performance Overview</h1>
          <p className="text-muted-foreground">
            Gain insights into your team's performance and manage their seal approval activities efficiently.
          </p>
        </div>

        <Card>
            <CardContent className="p-0">
                <div className="flex items-center justify-around divide-x">
                    <StatBlock icon={Users} title="Total Team Members" value="15" description="Active members on the team" />
                    <StatBlock icon={Zap} title="Avg. Efficiency Score" value="88%" description="Average PulseXEfficiency score this week" />
                    <StatBlock icon={Target} title="Total Pending Seals" value="28" description="Seals awaiting approval across the team" />
                    <StatBlock icon={TrendingDown} title="Overall Rejection Rate" value="4.2%" description="Percentage of rejected seals this month" />
                </div>
            </CardContent>
        </Card>


        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Performance Rank" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="top">Top Performers</SelectItem>
                        <SelectItem value="bottom">Lowest Performers</SelectItem>
                    </SelectContent>
                </Select>
                <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Branch/Op-center..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ny">New York</SelectItem>
                        <SelectItem value="sf">San Francisco</SelectItem>
                        <SelectItem value="tx">Texas</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button>
                <Download className="h-4 w-4 mr-2" />
                Export All Reports
            </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teamData.map((member) => (
            <Card key={member.id} className="flex flex-col">
              <CardHeader className="items-center text-center">
                <Avatar className="w-20 h-20 mb-2">
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback>{member.avatarFallback}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="text-sm text-muted-foreground">
                  Last Seal Submission: <span className="font-medium text-primary">{member.lastSubmission}</span>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span>PulseXEfficiency Score</span>
                    <Info className="h-4 w-4 cursor-pointer" />
                  </div>
                  <p className="text-4xl font-bold text-gray-800">{member.efficiencyScore}</p>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Circle className="h-2 w-2 text-red-500 fill-red-500" />
                      <span>Tasks: {member.tasks.rejected}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Circle className="h-2 w-2 text-green-500 fill-green-500" />
                      <span>Tasks: {member.tasks.approved}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full">
                  View Performance Report
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}