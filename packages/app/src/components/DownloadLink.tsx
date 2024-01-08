import { Button, ButtonProps } from "@chakra-ui/react";

export default function DownloadLink({
  data,
  filename,
  mimeType,
  ...rest
}: {
  data: ArrayBuffer;
  filename: string;
  mimeType: string;
} & ButtonProps) {
  const downloadUint8ArrayAsFile = () => {
    const blob = new Blob([data], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <Button onClick={downloadUint8ArrayAsFile} {...rest}>
      Download
    </Button>
  );
}
