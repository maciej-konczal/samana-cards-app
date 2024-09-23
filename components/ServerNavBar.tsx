import NavBar from "./NavBar";
import AuthButton from "./AuthButton";

export default function ServerNavBar() {
  return <NavBar authButton={<AuthButton />} />;
}
