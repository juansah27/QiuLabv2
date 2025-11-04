import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full max-w-md mx-auto mt-8 border-destructive">
          <CardHeader className="flex flex-row items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Terjadi Kesalahan</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Ada masalah saat menampilkan komponen ini.</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Muat Ulang Halaman
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 