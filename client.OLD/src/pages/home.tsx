import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, FileText, Calendar, Building2, MapPin } from "lucide-react";

const formSchema = z.object({
  entityName: z.string().min(1, "Entity name is required"),
  entityType: z.string().min(1, "Entity type is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  filingType: z.string().min(1, "Filing type is required"),
  deadline: z.string().optional(),
  risks: z.string().optional(),
  mitigation: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ComplianceReport {
  summary: string;
  checklist: string[];
  timeline: Array<{
    milestone: string;
    owner: string;
    dueDate: string;
    notes: string;
  }>;
  riskMatrix: Array<{
    risk: string;
    severity: string;
    likelihood: string;
    mitigation: string;
  }>;
  recommendations: string[];
  references: string[];
}

export default function HomePage() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entityName: "",
      entityType: "",
      jurisdiction: "",
      filingType: "",
      deadline: "",
      risks: "",
      mitigation: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/generate", { formData: data });
      return res.json();
    },
    onSuccess: (data) => {
      setReport(data as ComplianceReport);
      toast({
        title: "Report Generated",
        description: "Your compliance intelligence report is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    generateMutation.mutate(data);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold" data-testid="text-app-title">CompliPilot</h1>
          <p className="text-sm text-muted-foreground">Compliance Intelligence Platform</p>
        </div>
      </header>

      {/* Main Content - Two Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full">
            {/* Input Panel - 40% on desktop */}
            <Card className="lg:col-span-2 p-6 overflow-y-auto" data-testid="panel-input">
              <h2 className="text-lg font-semibold mb-4">Input</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-compliance">
                  <FormField
                    control={form.control}
                    name="entityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entity Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Acme Corp" 
                              className="pl-10" 
                              data-testid="input-entity-name"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entity Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-entity-type">
                              <SelectValue placeholder="Select entity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LLC">LLC</SelectItem>
                            <SelectItem value="Corporation">Corporation</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                            <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                            <SelectItem value="Nonprofit">Nonprofit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jurisdiction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jurisdiction</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="California" 
                              className="pl-10" 
                              data-testid="input-jurisdiction"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="filingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filing Type</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Annual Report" 
                              className="pl-10" 
                              data-testid="input-filing-type"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="date" 
                              className="pl-10" 
                              data-testid="input-deadline"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="risks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Concerns (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any specific compliance risks you're concerned about..."
                            rows={3}
                            data-testid="input-risks"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mitigation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mitigation Plan (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Your current mitigation strategy..."
                            rows={3}
                            data-testid="input-mitigation"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={generateMutation.isPending}
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Compliance Report"
                    )}
                  </Button>
                </form>
              </Form>
            </Card>

            {/* Results Panel - 60% on desktop */}
            <Card className="lg:col-span-3 p-6 overflow-y-auto" data-testid="panel-results">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              
              {!report ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Your compliance report will appear here...</p>
                </div>
              ) : (
                <div className="space-y-6 prose prose-sm max-w-none" data-testid="report-content">
                  {/* Executive Summary */}
                  <section>
                    <h3 className="text-xl font-semibold mb-2">Executive Summary</h3>
                    <p className="whitespace-pre-wrap">{report.summary}</p>
                  </section>

                  {/* Checklist */}
                  <section>
                    <h3 className="text-xl font-semibold mb-2">Filing Requirements Checklist</h3>
                    <ul className="list-none space-y-1">
                      {report.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* Timeline */}
                  {report.timeline.length > 0 && (
                    <section>
                      <h3 className="text-xl font-semibold mb-2">Compliance Roadmap</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border px-4 py-2 text-left">Milestone</th>
                              <th className="border px-4 py-2 text-left">Owner</th>
                              <th className="border px-4 py-2 text-left">Due Date</th>
                              <th className="border px-4 py-2 text-left">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.timeline.map((item, idx) => (
                              <tr key={idx}>
                                <td className="border px-4 py-2">{item.milestone}</td>
                                <td className="border px-4 py-2">{item.owner}</td>
                                <td className="border px-4 py-2">{item.dueDate}</td>
                                <td className="border px-4 py-2">{item.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {/* Risk Matrix */}
                  {report.riskMatrix.length > 0 && (
                    <section>
                      <h3 className="text-xl font-semibold mb-2">Risk Matrix</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border px-4 py-2 text-left">Risk</th>
                              <th className="border px-4 py-2 text-left">Severity</th>
                              <th className="border px-4 py-2 text-left">Likelihood</th>
                              <th className="border px-4 py-2 text-left">Mitigation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.riskMatrix.map((item, idx) => (
                              <tr key={idx}>
                                <td className="border px-4 py-2">{item.risk}</td>
                                <td className="border px-4 py-2">{item.severity}</td>
                                <td className="border px-4 py-2">{item.likelihood}</td>
                                <td className="border px-4 py-2">{item.mitigation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {/* Recommendations */}
                  <section>
                    <h3 className="text-xl font-semibold mb-2">Next Steps & Recommendations</h3>
                    <ol className="list-decimal list-inside space-y-1">
                      {report.recommendations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ol>
                  </section>

                  {/* References */}
                  {report.references.length > 0 && (
                    <section>
                      <h3 className="text-xl font-semibold mb-2">References</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {report.references.map((ref, idx) => (
                          <li key={idx}>{ref}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
