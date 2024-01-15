import { NextPage } from "next";
import { useRouter } from "next/router";

const BookDetails: NextPage = () => {
  const router = useRouter();

  return <div>And this is the book {router.query.bookId}</div>;
};

export default BookDetails;
