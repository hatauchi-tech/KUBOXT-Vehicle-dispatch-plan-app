import React, { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload } from 'lucide-react';
import { downloadCsvTemplate } from '../../utils/csvParser';
import type { ImportResult } from '../../services/importService';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onImport: (file: File) => Promise<ImportResult>;
  templateColumns: string[];
  sampleData?: string[][];
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  title,
  onImport,
  templateColumns,
  sampleData,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setPreview(null);
    setImporting(false);
    setResult(null);
    setErrors([]);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const readFileForPreview = useCallback((selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      // Check if Shift-JIS decoding produced replacement characters
      const hasReplacementChars = text.includes('\uFFFD');
      if (hasReplacementChars) {
        // Re-read as UTF-8
        const utf8Reader = new FileReader();
        utf8Reader.onload = () => {
          parsePreview(utf8Reader.result as string);
        };
        utf8Reader.readAsText(selectedFile, 'UTF-8');
      } else {
        parsePreview(text);
      }
    };
    reader.readAsText(selectedFile, 'Shift-JIS');
  }, []);

  const parsePreview = (text: string) => {
    Papa.parse<string[]>(text, {
      header: false,
      skipEmptyLines: true,
      preview: 6, // header + 5 rows
      complete: (results) => {
        if (results.data.length > 0) {
          const headers = results.data[0];
          const rows = results.data.slice(1);
          // Count total rows (excluding header) for display
          const allLines = text.split('\n').filter((line) => line.trim().length > 0);
          const totalRows = Math.max(allLines.length - 1, 0);
          setPreview({ headers, rows, totalRows });
        }
      },
    });
  };

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      setResult(null);
      setErrors([]);

      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setErrors(['CSVファイルを選択してください（.csv）']);
        return;
      }

      setFile(selectedFile);
      readFileForPreview(selectedFile);
    },
    [readFileForPreview],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setImporting(true);
    setErrors([]);
    setResult(null);

    try {
      const importResult = await onImport(file);
      setResult(importResult);
      if (importResult.errors.length > 0) {
        setErrors(importResult.errors);
      }
    } catch (err) {
      setErrors([
        `インポートエラー: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setImporting(false);
    }
  }, [file, onImport]);

  const handleDownloadTemplate = useCallback(() => {
    const filename = `${title}_テンプレート.csv`;
    downloadCsvTemplate(filename, templateColumns, sampleData);
  }, [title, templateColumns, sampleData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="閉じる"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
            <span className="text-sm text-blue-700">
              テンプレートCSVをダウンロードして、データを入力してください。
            </span>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 whitespace-nowrap ml-3"
            >
              テンプレートをダウンロード
            </button>
          </div>

          {/* Drag & Drop area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-gray-500 mb-2">
              <Upload className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-gray-600 mb-2">
              CSVファイルをドラッグ＆ドロップ
            </p>
            <p className="text-gray-400 text-sm mb-3">または</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded border border-gray-300 hover:bg-gray-200 text-sm"
            >
              ファイルを選択
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleInputChange}
              className="hidden"
            />
            {file && (
              <p className="mt-3 text-sm text-green-600">
                選択中: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Preview table */}
          {preview && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                プレビュー（先頭5行 / 全{preview.totalRows}行）
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {preview.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-2 text-left text-gray-600 font-medium border-b border-gray-200 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-3 py-2 text-gray-700 border-b border-gray-100 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.failed > 0
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <h3
                className={`font-semibold mb-1 ${
                  result.failed > 0 ? 'text-yellow-800' : 'text-green-800'
                }`}
              >
                インポート結果
              </h3>
              <p className="text-sm text-gray-700">
                成功: <span className="font-bold text-green-600">{result.success}件</span>
                {result.failed > 0 && (
                  <>
                    {' / '}失敗:{' '}
                    <span className="font-bold text-red-600">{result.failed}件</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">
                エラー ({errors.length}件)
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {errors.map((error, idx) => (
                  <p key={idx} className="text-sm text-red-700">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 min-h-[44px] text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"
          >
            閉じる
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-6 py-2 min-h-[44px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>インポート中...</span>
              </>
            ) : (
              'インポート実行'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
