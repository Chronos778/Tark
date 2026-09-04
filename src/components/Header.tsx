import { Navbar } from "./ui/mini-navbar";

const Header = ({ autoHide = false }: { autoHide?: boolean }) => {
  return <Navbar autoHide={autoHide} />;
};

export default Header;
