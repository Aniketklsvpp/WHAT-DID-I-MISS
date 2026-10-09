import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';

interface DropzoneProps {
  onFileLoaded: (fileText: string) => void;
}

export function Dropzone({ onFileLoaded }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const readFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileLoaded(text);
    };
    reader.readAsText(file);
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.txt')) {
        readFile(file);
      } else {
        alert("Please upload a .txt file");
      }
    }
  }, [readFile]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readFile(e.target.files[0]);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload WhatsApp chat text file dropzone"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          document.getElementById('file-input')?.click();
        }
      }}
      className={`w-full max-w-md border-[3px] border-dashed border-primary rounded-xl p-space-xl cursor-pointer bg-surface-container-lowest transition-all duration-150 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
        isDragging ? 'bg-secondary-container' : 'hover:bg-surface-container-low'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".txt"
        aria-label="Select WhatsApp chat export file"
        className="hidden"
        onChange={handleChange}
      />
      <span className="font-label-lg text-label-lg uppercase tracking-wider text-primary pointer-events-none">
        {isDragging ? 'Drop here...' : 'Drop your WhatsApp chat (.txt)'}
      </span>
    </div>
  );
}
