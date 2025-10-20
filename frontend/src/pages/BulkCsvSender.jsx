import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function BulkCsvSender({ onClose }) {
    const [file, setFile] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [jobStatus, setJobStatus] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv') {
                toast.error('Por favor, selecciona un archivo CSV.');
                return;
            }
            setFile(selectedFile);
        }
    };
    
    const handleSend = async () => {
        if (!file) {
            toast.error('Debes seleccionar un archivo CSV.');
            return;
        }

        setIsSending(true);
        setJobStatus(null);
        
        try {
            // Aquí iría la lógica de procesamiento del CSV y envío masivo
            // Por ahora es un mock
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            toast.success('Envío masivo programado correctamente.', {
                description: 'Se procesarán los registros del archivo CSV.'
            });
            setJobStatus({ success: true, message: 'Trabajo de envío masivo iniciado correctamente.' });
            
            // Limpiar formulario tras éxito
            setTimeout(() => {
                setFile(null);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error en envío masivo:', error);
            toast.error('Error al iniciar el envío masivo.', {
                description: error.message
            });
            setJobStatus({ success: false, message: `Error: ${error.message}` });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Envío Masivo por CSV</DialogTitle>
                    <DialogDescription>
                        Envía mensajes a una lista de contactos desde un archivo CSV. El archivo debe tener una columna llamada 'phone'.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    {/* File Upload */}
                    <div>
                        <Label htmlFor="csv-file">1. Sube tu archivo CSV</Label>
                        <div 
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-[#0071bc] transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="space-y-1 text-center">
                                {file ? (
                                    <>
                                        <FileText className="mx-auto h-12 w-12 text-[#0071bc]" />
                                        <p className="text-sm text-gray-600 font-semibold">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="text-sm text-gray-600">Haz clic para subir un archivo</p>
                                        <p className="text-xs text-gray-500">CSV, hasta 10MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <Input 
                            id="csv-file" 
                            type="file" 
                            accept=".csv"
                            ref={fileInputRef} 
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    
                    {jobStatus && (
                        <div className={`p-3 rounded-md flex items-start gap-3 text-sm ${jobStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                           {jobStatus.success ? <CheckCircle className="h-5 w-5 mt-0.5"/> : <AlertCircle className="h-5 w-5 mt-0.5" />}
                           <p>{jobStatus.message}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSending}>Cancelar</Button>
                    <Button 
                        onClick={handleSend} 
                        disabled={isSending || !file}
                        className="bg-gradient-to-r from-[#0071BC] to-[#2E3192] hover:from-[#005A99] hover:to-[#1E2570]"
                    >
                        {isSending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        Programar Envío
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
