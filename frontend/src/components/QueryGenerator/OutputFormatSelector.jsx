import PropTypes from 'prop-types';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { THEME_TRANSITIONS } from '../../utils/themeUtils';

const OUTPUT_FORMATS = [
  { id: 'in_clause', label: 'IN clause', example: "IN ('ID1', 'ID2')" },
  { id: 'where_clause', label: 'WHERE clause', example: "WHERE kode_barang IN ('ID1', 'ID2')" },
];

const OutputFormatSelector = ({ format, fieldName, onFormatChange }) => {
  return (
    <div className="space-y-2">
      <Label>Format Output</Label>
      
      <RadioGroup
        value={format}
        onValueChange={onFormatChange}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {OUTPUT_FORMATS.map((outputFormat) => (
          <Card
            key={outputFormat.id}
            className={cn(
              "p-3 cursor-pointer",
              "border-gray-200 dark:border-gray-500",
              "bg-white dark:bg-gray-800",
              "hover:bg-gray-50 dark:hover:bg-gray-700",
              format === outputFormat.id && "border-primary-400 dark:border-primary-200",
              THEME_TRANSITIONS.default
            )}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={outputFormat.id}
                id={`format-${outputFormat.id}`}
              />
              <Label
                htmlFor={`format-${outputFormat.id}`}
                className="cursor-pointer"
              >
                {outputFormat.label}
              </Label>
            </div>
            
            <div className="mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded">
              {outputFormat.example.replace('kode_barang', fieldName || 'kolom')}
            </div>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
};

OutputFormatSelector.propTypes = {
  format: PropTypes.string.isRequired,
  fieldName: PropTypes.string,
  onFormatChange: PropTypes.func.isRequired,
};

export default OutputFormatSelector; 