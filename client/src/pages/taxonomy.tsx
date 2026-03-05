import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { TaxonomyT1, TaxonomyT2, TaxonomyT3 } from "@shared/schema";
import { FolderTree, ChevronRight } from "lucide-react";

export default function TaxonomyPage() {
  const { data: t1s = [], isLoading: l1 } = useQuery<TaxonomyT1[]>({ queryKey: ["/api/taxonomy/t1"] });
  const { data: t2s = [], isLoading: l2 } = useQuery<TaxonomyT2[]>({ queryKey: ["/api/taxonomy/t2"] });
  const { data: t3s = [], isLoading: l3 } = useQuery<TaxonomyT3[]>({ queryKey: ["/api/taxonomy/t3"] });

  const isLoading = l1 || l2 || l3;

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Taxonomy Risiko</h1>
        <p className="text-muted-foreground mt-1">Klasifikasi tiga tingkat untuk standardisasi pelaporan risiko (T1 - T2 - T3)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tema (T1)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t1s.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Kategori (T2)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t2s.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Peristiwa (T3)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t3s.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            Struktur Taxonomy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {t1s.map((t1) => {
              const relatedT2 = t2s.filter(t => t.t1Id === t1.id);
              return (
                <AccordionItem key={t1.id} value={`t1-${t1.id}`}>
                  <AccordionTrigger className="text-sm font-semibold" data-testid={`accordion-t1-${t1.id}`}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">T1</Badge>
                      {t1.name}
                      <Badge variant="outline" className="text-[10px] ml-2">{relatedT2.length} kategori</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="ml-4 space-y-2">
                      {relatedT2.map((t2) => {
                        const relatedT3 = t3s.filter(t => t.t2Id === t2.id);
                        return (
                          <div key={t2.id} className="space-y-1">
                            <div className="flex items-center gap-2 py-1">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="secondary" className="text-[10px]">T2</Badge>
                              <span className="text-sm font-medium">{t2.name}</span>
                              <Badge variant="outline" className="text-[10px]">{relatedT3.length}</Badge>
                            </div>
                            {relatedT3.length > 0 && (
                              <div className="ml-8 space-y-1">
                                {relatedT3.map((t3) => (
                                  <div key={t3.id} className="flex items-center gap-2 py-0.5">
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <Badge variant="outline" className="text-[10px]">T3</Badge>
                                    <span className="text-sm text-muted-foreground">{t3.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
