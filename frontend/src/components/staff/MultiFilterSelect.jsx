"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";

export default function MultiFilterSelect({
  label,
  value = [],
  options = [],
  onChange,
  anyLabel = "Any",
  multiHint,
}) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        label={label}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(typeof v === "string" ? v.split(",") : v);
        }}
        renderValue={(selected) => {
          if (!selected.length) return anyLabel;
          if (selected.length <= 2) return selected.join(", ");
          return `${selected.length} ${multiHint || "selected"}`;
        }}
      >
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            <Checkbox size="small" checked={value.indexOf(opt) > -1} />
            <ListItemText primary={opt} />
          </MenuItem>
        ))}
      </Select>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
          {value.map((v) => (
            <Chip
              key={v}
              label={v}
              size="small"
              onDelete={() => onChange(value.filter((x) => x !== v))}
              sx={{ height: 22, fontSize: 11 }}
            />
          ))}
        </Box>
      )}
    </FormControl>
  );
}
