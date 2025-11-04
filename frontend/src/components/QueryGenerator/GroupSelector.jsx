import PropTypes from 'prop-types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

const QUERY_GROUPS = [
  { id: 'cek_so_jda', label: 'Cek SO dan JDA' },
  { id: 'cek_xml_new', label: 'Cek XML dan New' },
  { id: 'reopen_door', label: 'Reopen Door' },
  { id: 'uncheckin', label: 'Uncheckin' },
  { id: 'validasi_bundle', label: 'Validasi Bundle' },
  { id: 'validasi_supplementary', label: 'Validasi Supplementary' },
  { id: 'validasi_gift', label: 'Validasi Gift' },
  { id: 'sync_isupdate', label: 'Sync IsUpdate' },
  { id: 'query_in_custom', label: 'Query IN (Custom Only)' },
  { id: 'delete_by_id', label: 'Delete by ID' },
];

const GroupSelector = ({ selectedGroup, onGroupChange }) => {
  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedGroup}
        onValueChange={onGroupChange}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
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