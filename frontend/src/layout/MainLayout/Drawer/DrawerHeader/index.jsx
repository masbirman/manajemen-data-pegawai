import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import { Stack, Chip, Typography, Box } from "@mui/material";

// project import
import DrawerHeaderStyled from "./DrawerHeaderStyled";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ==============================|| DRAWER HEADER ||============================== //

const DrawerHeader = ({ open }) => {
  const theme = useTheme();

  return (
    <DrawerHeaderStyled theme={theme} open={open}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: "1.2rem",
          }}
        >
          📊
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            Data Pegawai
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sistem Perbandingan
          </Typography>
        </Box>
      </Stack>
    </DrawerHeaderStyled>
  );
};

DrawerHeader.propTypes = {
  open: PropTypes.bool,
};

export default DrawerHeader;
