
import { listOrganizations, createOrganization } from "@/actions/organization";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui/components/card";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default async function DashboardPage() {
  const orgs = await listOrganizations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
            <p className="text-muted-foreground">Manage your organizations and their API keys.</p>
        </div>
        <div className="flex items-center gap-2">
            {/* Future Search Input */}
            {/* <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                    type="search"
                    placeholder="Search..."
                    className="pl-8 h-9 w-[150px] lg:w-[250px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
            </div> */}
            {/* For V1 strict creation form in a nice card/popover is better than inline */}
        </div>
      </div>

        {/* Create Organization Section - Kept Inline for simplicity in V1 but styled better */}
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create New Organization</CardTitle>
                <CardDescription>Enter the name of the new organization to generate an API key.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={createOrganization} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Organization Name</label>
                         <input 
                            name="name" 
                            placeholder="e.g. Acme Corp" 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                            required 
                        />
                    </div>
                    <Button type="submit">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Organization
                    </Button>
                </form>
            </CardContent>
        </Card>

      <div className="rounded-md border bg-card text-card-foreground shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{org.id}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">••••••••</TableCell>
                <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={`/orgs/${org.id}`}>Manage</Link>
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
