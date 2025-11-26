import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

const DrawerHeaderStyled = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  ...theme.mixins.toolbar,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  paddingLeft: theme.spacing(open ? 3 : 2.5),
  paddingRight: theme.spacing(2),
}));

export default DrawerHeaderStyled;
