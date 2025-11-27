import PropTypes from "prop-types";

// material-ui
import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

// ==============================|| BREADCRUMBS - SIMPLE ||============================== //

export default function Breadcrumbs({ title, links = [], sx, ...others }) {
  return (
    <Box sx={{ mb: 2, ...sx }} {...others}>
      {links.length > 0 && (
        <MuiBreadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
          {links.map((link, index) => (
            <Typography
              key={index}
              variant="body2"
              color={
                index === links.length - 1 ? "text.primary" : "text.secondary"
              }
              sx={{ fontWeight: index === links.length - 1 ? 500 : 400 }}
            >
              {link.title}
            </Typography>
          ))}
        </MuiBreadcrumbs>
      )}
      {title && (
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      )}
    </Box>
  );
}

Breadcrumbs.propTypes = {
  title: PropTypes.string,
  links: PropTypes.array,
  sx: PropTypes.any,
};
