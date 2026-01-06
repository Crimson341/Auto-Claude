import { useState } from 'react';
import { Loader2, GitPullRequest, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../ui/dialog';

interface CreatePullRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultSourceBranch?: string;
  defaultTargetBranch?: string;
  onSuccess?: (prNumber: number) => void;
}

export function CreatePullRequestDialog({
  open,
  onOpenChange,
  projectId,
  defaultSourceBranch = '',
  defaultTargetBranch = 'main',
  onSuccess
}: CreatePullRequestDialogProps) {
  const { t } = useTranslation('common');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBranch, setSourceBranch] = useState(defaultSourceBranch);
  const [targetBranch, setTargetBranch] = useState(defaultTargetBranch);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateWithAI = async () => {
    if (!sourceBranch.trim() || !targetBranch.trim()) {
      setError(t('prCreate.branchesRequired'));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await window.electronAPI.github.generatePRContent(projectId, {
        sourceBranch: sourceBranch.trim(),
        targetBranch: targetBranch.trim()
      });

      if (result.success && result.data) {
        setTitle(result.data.title);
        setDescription(result.data.description);
      } else {
        setError(result.error || t('prCreate.generateError'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prCreate.generateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !sourceBranch.trim() || !targetBranch.trim()) {
      setError(t('prCreate.fieldsRequired'));
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await window.electronAPI.github.createPR(projectId, {
        title: title.trim(),
        body: description.trim(),
        head: sourceBranch.trim(),
        base: targetBranch.trim()
      });

      if (result.success && result.data) {
        onSuccess?.(result.data.number);
        onOpenChange(false);
        // Reset form
        setTitle('');
        setDescription('');
        setSourceBranch(defaultSourceBranch);
        setTargetBranch(defaultTargetBranch);
      } else {
        setError(result.error || t('prCreate.createError'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('prCreate.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset error when closing
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            {t('prCreate.title')}
          </DialogTitle>
          <DialogDescription>
            {t('prCreate.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">{t('prCreate.sourceBranch')}</Label>
              <Input
                id="source"
                placeholder="feature/my-feature"
                value={sourceBranch}
                onChange={(e) => setSourceBranch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">{t('prCreate.targetBranch')}</Label>
              <Input
                id="target"
                placeholder="main"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !sourceBranch.trim() || !targetBranch.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('prCreate.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t('prCreate.generateWithAI')}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t('prCreate.prTitle')}</Label>
            <Input
              id="title"
              placeholder={t('prCreate.prTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t('prCreate.prDescription')} <span className="text-muted-foreground">({t('labels.optional')})</span>
            </Label>
            <Textarea
              id="description"
              placeholder={t('prCreate.prDescriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || isGenerating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('prCreate.creating')}
              </>
            ) : (
              t('prCreate.createPR')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
