'use client';

import { useEffect, useState } from 'react';
import { listAvailableModels, ListModelsOutput } from '@/ai/flows/list-models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SupportedFeature({ supported }: { supported: boolean }) {
    return supported ? <Check className="text-green-600" /> : <X className="text-destructive" />;
}

export default function ListModelsPage() {
    const [modelData, setModelData] = useState<ListModelsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchModels() {
            setIsLoading(true);
            try {
                const results = await listAvailableModels();
                setModelData(results);
            } catch (error: any) {
                console.error("Error fetching models:", error);
                toast({
                    title: "Failed to fetch models",
                    description: error.message || "An unexpected error occurred.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchModels();
    }, [toast]);

    return (
        <div className="grid flex-1 auto-rows-max items-start gap-4 md:gap-8">
            <div>
                <h1 className="font-headline text-3xl font-bold">Available AI Models</h1>
                <p className="text-muted-foreground">
                    This is a list of all AI models your application can see with the current credentials.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Model List</CardTitle>
                    <CardDescription>
                        Use the "Name" column in your application's model configuration files.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Label</TableHead>
                                <TableHead className="text-center">Text</TableHead>
                                <TableHead className="text-center">Tools</TableHead>
                                <TableHead className="text-center">Media (Vision)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="mx-auto size-5 rounded-full" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="mx-auto size-5 rounded-full" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="mx-auto size-5 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : modelData?.models.length ? (
                                modelData.models.map((model) => (
                                    <TableRow key={model.name}>
                                        <TableCell className="font-mono text-xs">
                                            {model.name.startsWith('googleai/') ? (
                                                <Badge variant="secondary">{model.name.replace('googleai/', '')}</Badge>
                                            ) : (
                                                model.name
                                            )}
                                        </TableCell>
                                        <TableCell>{model.label}</TableCell>
                                        <TableCell className="text-center"><SupportedFeature supported={model.supports.generate} /></TableCell>
                                        <TableCell className="text-center"><SupportedFeature supported={model.supports.tools} /></TableCell>
                                        <TableCell className="text-center"><SupportedFeature supported={model.supports.media} /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No models found or could not be loaded.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
