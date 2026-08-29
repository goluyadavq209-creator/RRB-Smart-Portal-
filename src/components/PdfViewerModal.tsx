import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink, 
  Maximize2, 
  Sparkles, 
  AlertCircle,
  Eye,
  Layers,
  Search
} from 'lucide-react';

// Configure pdfjs worker safely
try {
  if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  }
} catch {
  // Silent fallback
}

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfSource: string | File; // Can be a URL, base64 data URI, or File object
  extractedText?: string;
  onExtractData?: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  pdfSource,
  extractedText,
  onExtractData,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // Initialize PDF loading
  useEffect(() => {
    if (!isOpen || !pdfSource) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setPageNumber(1);

    const loadDocument = async () => {
      try {
        let loadingTask: any;

        if (pdfSource instanceof File) {
          const arrayBuffer = await pdfSource.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else if (typeof pdfSource === 'string' && pdfSource.startsWith('data:')) {
          setPdfBlobUrl(pdfSource);
          loadingTask = pdfjsLib.getDocument({ url: pdfSource });
        } else if (typeof pdfSource === 'string') {
          setPdfBlobUrl(pdfSource);
          loadingTask = pdfjsLib.getDocument({ url: pdfSource });
        } else {
          throw new Error('Unsupported PDF source.');
        }

        const doc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('PDF Loading error, switching to fallback viewer:', err);
          setError(err.message || 'Unable to render PDF via canvas viewer. You can view extracted text or open in browser.');
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      if (pdfBlobUrl && pdfSource instanceof File) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [isOpen, pdfSource]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || activeTab !== 'visual') return;

    let isRenderCancelled = false;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNumber);
        if (isRenderCancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      isRenderCancelled = true;
    };
  }, [pdfDoc, pageNumber, scale, rotation, activeTab]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = `${title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[90vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Top Header Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-white truncate">
                {title || 'RRB Official PDF Document'}
              </h3>
              <p className="text-xs text-slate-400 flex items-center space-x-2">
                <span>Official Notice / Merit List / Cut-Off</span>
                {numPages > 0 && <span>• {numPages} Page{numPages > 1 ? 's' : ''}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 hidden sm:flex text-xs">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Extracted Text</span>
              </button>
            </div>

            {onExtractData && (
              <button
                onClick={onExtractData}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                title="Extract structured tables & records directly into the RRB Portal"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Extract to Database</span>
              </button>
            )}

            {pdfBlobUrl && (
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Download Official PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar for Visual Controls */}
        {activeTab === 'visual' && !error && (
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Page Navigation */}
            <div className="flex items-center space-x-2">
              <button
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 border border-slate-700 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-300 font-mono text-xs">
                Page <span className="font-bold text-white">{pageNumber}</span> of{' '}
                <span className="font-bold text-white">{numPages || 1}</span>
              </span>
              <button
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 border border-slate-700 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom & Rotation Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-slate-300 font-mono text-xs w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 flex items-center justify-center relative">
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-3 py-12">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Rendering PDF pages...</p>
            </div>
          )}

          {error && (
            <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <div>
                <h4 className="font-bold text-white text-sm">Visual Render Notice</h4>
                <p className="text-xs text-slate-400 mt-1">{error}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => setActiveTab('text')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  View Extracted Text
                </button>
                {pdfBlobUrl && (
                  <a
                    href={pdfBlobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Visual PDF Canvas */}
          {activeTab === 'visual' && !loading && !error && (
            <div className="max-w-full overflow-auto flex justify-center py-2 shadow-2xl rounded-lg">
              <canvas ref={canvasRef} className="rounded-md shadow-2xl bg-white max-w-full" />
            </div>
          )}

          {/* Extracted Text View */}
          {activeTab === 'text' && (
            <div className="w-full h-full max-w-4xl bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search words / roll numbers in text..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-amber-500 selection:text-slate-950">
                {extractedText ? (
                  searchTerm ? (
                    extractedText.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === searchTerm.toLowerCase() ? (
                        <mark key={i} className="bg-amber-400 text-slate-950 font-bold px-0.5 rounded">
                          {part}
                        </mark>
                      ) : (
                        part
                      )
                    )
                  ) : (
                    extractedText
                  )
                ) : (
                  <div className="text-slate-500 text-center py-12">
                    No text extracted yet for this document.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="truncate">
            Ministry of Railways • Official RRB Document Viewer
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
