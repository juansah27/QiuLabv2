import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { Copy, Check } from 'lucide-react';

const SqlOutput = ({ sql, showCopyButton = true }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      // Cek apakah Clipboard API tersedia
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sql);
      } else {
        // Fallback untuk browser yang tidak mendukung Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = sql;
        
        // Menyembunyikan textarea dari pandangan
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (!successful) {
          throw new Error('Gagal menyalin menggunakan execCommand');
        }
        
        document.body.removeChild(textArea);
      }
      
      setCopySuccess(true);
      
      // Reset pesan sukses setelah 2 detik
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Gagal menyalin ke clipboard:', err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="relative">
            {showCopyButton && (
              <div className="flex justify-end p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  {copySuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <pre className={cn(
              "bg-muted p-4 overflow-x-auto text-sm whitespace-pre-wrap",
              "font-mono text-muted-foreground"
            )}>
              {sql}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

SqlOutput.propTypes = {
  sql: PropTypes.string.isRequired,
  showCopyButton: PropTypes.bool
};

export default SqlOutput; 