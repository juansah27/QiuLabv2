import PropTypes from 'prop-types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

const QUERY_GROUPS = [
  { id: 'reopen_door', label: 'Reopen Door WMS' },
  { id: 'uncheckin', label: 'Uncheckin' },
  { id: 'validasi_bundle', label: 'Validasi Bundle' },
  { id: 'validasi_supplementary', label: 'Validasi Supplementary' },
  { id: 'validasi_gift', label: 'Validasi Gift' },
  { id: 'query_in_custom', label: 'Query IN (Custom Only)' },
  { id: 'delete_by_id', label: 'Delete by Systemrefid / Ordnum' },
  { id: 'delete_duplikat', label: 'Delete Duplikat' },
  { id: 'update_dtmcrt_entdte', label: 'Update DtmCrt dan Entdte' },
  { id: 'replace_sku', label: 'Replace SKU' },
  { id: 'update_reference_number', label: 'Update Reference Number' },
  { id: 'update_po_number', label: 'Update PO Number' },
  { id: 'update_delivery_note', label: 'Update Delivery Note' },
  { id: 'template_pero', label: 'Template Pero' },
  { id: 'query_so_sol', label: 'Query SO & SOL' },
  { id: 'query_xml_xml_line', label: 'Query XML dan XML Line' },
  { id: 'line_live', label: 'Line Live' },
  { id: 'manifest_order', label: 'Manifest Order' },
  { id: 'data_cekin', label: 'Data Cekin' },
];

const GroupSelector = ({ selectedGroup, onGroupChange }) => {
  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedGroup}
        onValueChange={onGroupChange}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2"
      >
        {QUERY_GROUPS.map((group) => (
          <Card
            key={group.id}
            className={cn(
              "p-3 cursor-pointer transition-colors bg-white dark:bg-[#374151] border-0",
              selectedGroup === group.id && "border-primary"
            )}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={group.id}
                id={`group-${group.id}`}
              />
              <Label
                htmlFor={`group-${group.id}`}
                className="cursor-pointer"
              >
                {group.label}
              </Label>
            </div>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
};

GroupSelector.propTypes = {
  selectedGroup: PropTypes.string.isRequired,
  onGroupChange: PropTypes.func.isRequired,
};

export default GroupSelector; 