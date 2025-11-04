import PropTypes from 'prop-types';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const MARKETPLACE_OPTIONS = [
  { value: 'SHOPE', label: 'SHOPE' },
  { value: 'TOPED', label: 'TOPED' },
  { value: 'LAZAD', label: 'LAZAD' },
  { value: 'BLIBLI', label: 'BLIBLI' },
  { value: 'TIKTOK', label: 'TIKTOK' },
  { value: 'ZALOR', label: 'ZALOR' },
];

const IdInput = ({ 
  ids, 
  yardLoc, 
  marketplace,
  showYardLoc, 
  showMarketplace,
  onIdsChange, 
  onYardLocChange, 
  onMarketplaceChange,
  isCustomInQuery = false 
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="id-list">
          Daftar ID
        </Label>
        <Textarea
          id="id-list"
          rows="6"
          placeholder="Masukkan ID (SystemRefId, ORDNUM, atau SKU), pisahkan dengan koma atau newline."
          value={ids}
          onChange={(e) => onIdsChange(e.target.value)}
          className="font-mono"
        />
        <p className="text-sm text-muted-foreground">
          {isCustomInQuery 
            ? "Masukkan ID alfanumerik (menerima karakter -, _, /, dan spasi). Tidak ada batasan jumlah maksimal." 
            : "Masukkan ID alfanumerik (menerima karakter -, _, /, dan spasi). Maksimal 500 ID."}
        </p>
      </div>

      {showYardLoc && (
        <div className="space-y-2">
          <Label htmlFor="yard-loc">
            Yard Location
          </Label>
          <Input
            id="yard-loc"
            type="text"
            placeholder="Masukkan yard location"
            value={yardLoc}
            onChange={(e) => onYardLocChange(e.target.value)}
          />
        </div>
      )}

      {showMarketplace && (
        <div className="space-y-2">
          <Label htmlFor="marketplace">
            Marketplace
          </Label>
          <Select
            value={marketplace}
            onValueChange={onMarketplaceChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih marketplace" />
            </SelectTrigger>
            <SelectContent>
              {MARKETPLACE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

IdInput.propTypes = {
  ids: PropTypes.string.isRequired,
  yardLoc: PropTypes.string.isRequired,
  marketplace: PropTypes.string.isRequired,
  showYardLoc: PropTypes.bool.isRequired,
  showMarketplace: PropTypes.bool.isRequired,
  onIdsChange: PropTypes.func.isRequired,
  onYardLocChange: PropTypes.func.isRequired,
  onMarketplaceChange: PropTypes.func.isRequired,
  isCustomInQuery: PropTypes.bool
};

export default IdInput; 