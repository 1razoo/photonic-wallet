import { Icon, IconProps } from "@chakra-ui/react";

export default function AtomIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 32 32" {...props}>
      <path
        d="M16 1.75l-3.653 6.506L24.696 30.25H32zm-8.695 28.5l6.73-11.987-3.653-6.506L0 30.25z"
        paint-order="stroke markers fill"
      />
    </Icon>
  );
}
