import { HStack, Icon, IconButton, StackProps } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { MdFirstPage, MdNavigateBefore, MdNavigateNext } from "react-icons/md";

export default function Pagination({
  page,
  startUrl,
  prevUrl,
  nextUrl,
  size = "md",
  ...rest
}: {
  page: number;
  startUrl?: string;
  prevUrl?: string;
  nextUrl?: string;
  size?: "sm" | "md";
} & StackProps) {
  return (
    <HStack justifyContent="right" {...rest}>
      {page > 1 && startUrl && (
        <IconButton
          icon={<Icon as={MdFirstPage} fontSize="2xl" />}
          size={size}
          as={Link}
          to={startUrl}
          aria-label="First page"
        />
      )}
      <IconButton
        icon={<Icon as={MdNavigateBefore} fontSize="2xl" />}
        size={size}
        as={Link}
        to={prevUrl}
        aria-label="Previous page"
        isDisabled={page == 0}
      />
      {nextUrl ? (
        <IconButton
          icon={<Icon as={MdNavigateNext} fontSize="2xl" />}
          size={size}
          as={Link}
          to={nextUrl}
          aria-label="Next page"
        />
      ) : (
        <IconButton
          icon={<Icon as={MdNavigateNext} fontSize="2xl" />}
          size={size}
          aria-label="Next page"
          isDisabled
        />
      )}
    </HStack>
  );
}
