import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { cn } from '../../lib/utils';
import { FileText, FileSpreadsheet } from 'lucide-react';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: id });
  } catch (error) {
    return dateString;
  }
};

const RecentActivity = ({ title, items, type, emptyMessage, linkTo }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      
      {items.length === 0 ? (
        <CardContent className="text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="p-4 hover:bg-accent/50">
                <Link to={`/${type}/${item.id}`} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="mr-3">
                      {type === 'excel' ? (
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </span>
                    <div>
                      <h4 className="text-sm font-medium">
                        {type === 'excel' ? item.filename : item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(type === 'excel' ? item.upload_date : item.updated_at)}
                      </p>
                    </div>
                  </div>
                  
                  {type === 'excel' && (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      
      {items.length > 0 && (
        <CardFooter className="bg-muted/50">
          <Link 
            to={linkTo} 
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Lihat Semua
          </Link>
        </CardFooter>
      )}
    </Card>
  );
};

export default RecentActivity; 