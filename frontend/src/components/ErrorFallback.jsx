import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

/**
 * Komponen fallback untuk Error Boundary
 * @param {Object} props - Properties dari error boundary
 * @param {Error} props.error - Error object
 * @param {Function} props.resetErrorBoundary - Function untuk reset error boundary
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive text-center">
            Terjadi Kesalahan
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-left overflow-auto max-h-64 text-sm">
            <p className="font-semibold">Error Message:</p>
            <pre className="mt-1">{error.message}</pre>
            
            {error.stack && (
              <>
                <p className="font-semibold mt-3">Stack Trace:</p>
                <pre className="mt-1 text-xs opacity-75">{error.stack}</pre>
              </>
            )}
          </div>
          
          <p className="text-muted-foreground text-center">
            Silakan muat ulang aplikasi untuk coba lagi.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center space-x-4">
          <Button
            onClick={resetErrorBoundary}
            variant="default"
          >
            Coba Lagi
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
          >
            Muat Ulang Aplikasi
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ErrorFallback; 