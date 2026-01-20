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
  targetDate,
  skuLama,
  skuBaru,
  showYardLoc,
  showMarketplace,
  showTargetDate,
  showSkuReplace,
  onIdsChange,
  onYardLocChange,
  onMarketplaceChange,
  onTargetDateChange,
  onSkuLamaChange,
  onSkuBaruChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showDateRange = false,
  showIds = true,
  isCustomInQuery = false
}) => {
  return (
    <div className="space-y-4">
      {showIds && (
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
              : "Masukkan ID alfanumerik (menerima karakter -, _, /, dan spasi). Maksimal 1000 ID."}
          </p>
        </div>
      )}

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

      {showTargetDate && (
        <div className="space-y-2">
          <Label htmlFor="target-date">
            Target Date (Tanggal H-1)
          </Label>
          <Input
            id="target-date"
            type="date"
            value={targetDate}
            onChange={(e) => onTargetDateChange(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Default: kemarin ({new Date(Date.now() - 86400000).toISOString().split('T')[0]})
          </p>
        </div>
      )}

      {showSkuReplace && (
        <>
          <div className="space-y-2">
            <Label htmlFor="sku-lama">
              SKU Lama (yang akan diganti)
            </Label>
            <Textarea
              id="sku-lama"
              rows="3"
              placeholder="Masukkan SKU lama, pisahkan dengan koma atau newline"
              value={skuLama}
              onChange={(e) => onSkuLamaChange(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku-baru">
              SKU Baru (pengganti)
            </Label>
            <Input
              id="sku-baru"
              type="text"
              placeholder="Masukkan SKU baru (1 SKU saja)"
              value={skuBaru}
              onChange={(e) => onSkuBaruChange(e.target.value)}
            />
          </div>
        </>
      )}

      {showDateRange && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

IdInput.propTypes = {
  ids: PropTypes.string.isRequired,
  yardLoc: PropTypes.string.isRequired,
  marketplace: PropTypes.string.isRequired,
  targetDate: PropTypes.string.isRequired,
  skuLama: PropTypes.string.isRequired,
  skuBaru: PropTypes.string.isRequired,
  showYardLoc: PropTypes.bool.isRequired,
  showMarketplace: PropTypes.bool.isRequired,
  showTargetDate: PropTypes.bool.isRequired,
  showSkuReplace: PropTypes.bool.isRequired,
  onIdsChange: PropTypes.func.isRequired,
  onYardLocChange: PropTypes.func.isRequired,
  onMarketplaceChange: PropTypes.func.isRequired,
  onTargetDateChange: PropTypes.func.isRequired,
  onSkuLamaChange: PropTypes.func.isRequired,
  onSkuBaruChange: PropTypes.func.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
  showDateRange: PropTypes.bool,
  showIds: PropTypes.bool,
  isCustomInQuery: PropTypes.bool
};

export default IdInput; 