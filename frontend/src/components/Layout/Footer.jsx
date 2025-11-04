import { cn } from '../../lib/utils';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn(
      "py-3 px-6 border-t border-border",
      "bg-background flex-shrink-0"
    )}>
      <div className="flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Excel & SQL Data Management App
        </p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Bantuan
          </a>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Kebijakan Privasi
          </a>
          <a 
            href="#" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Syarat & Ketentuan
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 