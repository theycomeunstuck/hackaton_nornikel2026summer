export type DownloadFileOptions = {
  filename: string;
  content: string;
  contentType: string;
};

export function downloadFile({ filename, content, contentType }: DownloadFileOptions) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
