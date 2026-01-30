import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { UploadArea, UploadedFile } from '../ui/UploadArea';
import { Badge } from '../ui/Badge';
import { TemplateSlot } from '../../hooks/useTemplates';
import { CheckCircle2, Circle } from 'lucide-react';

export interface SlotAsset {
  slotId: string;
  file: File | null;
}

export interface AssetSlotMapperProps {
  slots: TemplateSlot[];
  slotAssets: SlotAsset[];
  onAssetAdded: (slotId: string, file: File) => void;
  onAssetRemoved: (slotId: string) => void;
  disabled?: boolean;
}

export const AssetSlotMapper: React.FC<AssetSlotMapperProps> = ({
  slots,
  slotAssets,
  onAssetAdded,
  onAssetRemoved,
  disabled = false,
}) => {
  const getSlotAsset = (slotId: string): File | null => {
    return slotAssets.find((sa) => sa.slotId === slotId)?.file || null;
  };

  const getAcceptedTypes = (type: 'image' | 'video'): Record<string, string[]> => {
    if (type === 'image') {
      return { 'image/jpeg': ['.jpg', '.jpeg'] };
    }
    return { 'video/mpeg': ['.mpeg', '.mpg'] };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upload Assets</CardTitle>
          <Badge variant="info">
            {slotAssets.filter((sa) => sa.file !== null).length} / {slots.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {slots.map((slot) => {
            const slotFile = getSlotAsset(slot.slotId);
            const uploadedFiles: UploadedFile[] = slotFile
              ? [{ file: slotFile }]
              : [];

            return (
              <div key={slot.slotId} className="p-4 bg-bg-tertiary border border-border-subtle rounded-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {slotFile ? (
                        <CheckCircle2 className="w-4 h-4 text-status-online" />
                      ) : (
                        <Circle className="w-4 h-4 text-status-offline" />
                      )}
                      <h4 className="text-sm font-semibold text-text-primary">
                        {slot.label}
                      </h4>
                      {slot.required && (
                        <Badge size="sm" variant="error">
                          Required
                        </Badge>
                      )}
                    </div>
                    {slot.description && (
                      <p className="text-xs text-text-tertiary ml-6">
                        {slot.description}
                      </p>
                    )}
                  </div>
                  <Badge size="sm" variant="default">
                    {slot.type}
                  </Badge>
                </div>

                <UploadArea
                  onFilesAdded={(files) => files[0] && onAssetAdded(slot.slotId, files[0])}
                  onFileRemove={() => onAssetRemoved(slot.slotId)}
                  uploadedFiles={uploadedFiles}
                  accept={getAcceptedTypes(slot.type)}
                  maxFiles={1}
                  disabled={disabled}
                  helperText={`Upload ${slot.type} (max 100MB)`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
