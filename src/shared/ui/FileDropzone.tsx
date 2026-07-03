import { useRef, useState, type DragEvent } from "react";

export type SelectedUploadFile = {
  name: string;
  size: number;
  type: string;
};

type FileDropzoneProps = {
  selectedFile: SelectedUploadFile | null;
  onFileSelect: (file: SelectedUploadFile) => void;
};

const acceptedExtensions = ".pdf,.docx,.txt,.csv,.xlsx";

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(Math.round(size / 1024), 1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toSelectedUploadFile(file: File): SelectedUploadFile {
  return {
    name: file.name,
    size: file.size,
    type: file.type || file.name.split(".").pop()?.toUpperCase() || "unknown",
  };
}

export function FileDropzone({ selectedFile, onFileSelect }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];

    if (file) {
      onFileSelect(toSelectedUploadFile(file));
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`rounded border-2 border-dashed p-6 transition ${
        isDragging
          ? "border-ice-500 bg-ice-50"
          : "border-slate-300 bg-white/78 hover:border-ice-300 hover:bg-ice-50/45"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedExtensions}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelect(toSelectedUploadFile(file));
          }
        }}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
            Document intake
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            Перетащите документ или выберите файл
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Поддерживаются PDF, DOCX, TXT, CSV и XLSX. В этой итерации файл не
            отправляется на backend, обработка симулируется локально.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded bg-graphite-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-graphite-800"
        >
          Выбрать файл
        </button>
      </div>

      {selectedFile ? (
        <div className="mt-5 grid grid-cols-3 gap-3 rounded border border-ice-100 bg-ice-50 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Name
            </p>
            <p className="mt-1 font-semibold text-slate-900">{selectedFile.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Size
            </p>
            <p className="mt-1 font-semibold text-slate-900">{formatFileSize(selectedFile.size)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Type
            </p>
            <p className="mt-1 font-semibold text-slate-900">{selectedFile.type}</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Файл пока не выбран. После выбора можно запустить mock processing pipeline.
        </div>
      )}
    </div>
  );
}
