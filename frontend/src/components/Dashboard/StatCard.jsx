import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../ui/card';
import { cn } from '../../lib/utils';

const StatCard = ({ title, value, icon, linkTo, linkText, className }) => {
  return (
    <Card className={cn("p-6", className)}>
      <CardContent className="p-0">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-3 bg-primary/10 rounded-md text-primary">
            {icon}
          </div>
          <div className="ml-5">
            <h3 className="text-lg font-medium text-muted-foreground">
              {title}
            </h3>
            <div className="mt-1 text-3xl font-semibold">
              {value}
            </div>
          </div>
        </div>
      </CardContent>
      {linkTo && linkText && (
        <CardFooter className="p-0 pt-6">
          <Link 
            to={linkTo} 
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {linkText} &rarr;
          </Link>
        </CardFooter>
      )}
    </Card>
  );
};

export default StatCard; 