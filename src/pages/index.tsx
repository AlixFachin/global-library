import { useUser } from "@clerk/nextjs";
import Head from "next/head";
import { type RouterOutputs, api } from "~/utils/api";
import Image from "next/image";
import { Header } from "~/components/header";
import Spinner from "~/components/spinner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ja from "dayjs/locale/ja";
import en from "dayjs/locale/en";
import Link from "next/link";

// Components

type BookEnhanced = RouterOutputs["books"]["getAll"][number];

dayjs.extend(relativeTime);

const BookCard: React.FC<BookEnhanced> = (props) => {
  const { book, firstOwner } = props;

  return (
    <div className="mb-2 flex w-full flex-col justify-start border-[1px] border-gray-800 p-2">
      <div className="flex flex-wrap items-center gap-2 px-2">
        <Link href={`/books/${book.id}`}>
          <span className="mr-2 text-lg">{book.title}</span>
        </Link>
        <span className="italic">({book.author})</span>
      </div>
      <div className="px-8 text-sm">{`registered ${dayjs(
        book.createdAt
      ).fromNow()}`}</div>
    </div>
  );
};

const HomeBookList: React.FC<{ bookList: BookEnhanced[] | undefined }> = ({
  bookList,
}) => {
  return (
    //
    <section
      className="flex w-full max-w-3xl flex-col rounded-lg 
      bg-[#FAEDCD] p-4"
    >
      <h1 className="mb-2 text-3xl">Recently Registered Books...</h1>
      {!bookList && (
        <div> Your have no books registered! Click on Add to add some! </div>
      )}
      {!!bookList &&
        bookList.map((bookWithOwner) => (
          <BookCard key={bookWithOwner.book.id} {...bookWithOwner} />
        ))}
    </section>
  );
};

// Main Index Page -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export default function Home() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { data: bookData, isLoading: isBookDataLoading } =
    api.books.getAll.useQuery();

  if (!isBookDataLoading && !bookData) {
    return <div>Woops!</div>;
  }

  // Returns empty stuff if nothing is loaded
  if (!isUserLoaded && !isBookDataLoading) {
    return (
      <main>
        <h1>Just a little bit more time...</h1>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>The Global Library</title>
        <meta
          name="description"
          content="Give away the books you are done reading"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center bg-gradient-to-b from-[#FEFAE0] to-[#FAEDCD]">
        <Header />
        <div className="h-20">
          {/* filler to compensate for the sticky header */}
        </div>
        {isBookDataLoading && (
          <div className="flex h-[400px] w-full flex-col items-center justify-center ">
            <Spinner />
          </div>
        )}

        {!isBookDataLoading && <HomeBookList bookList={bookData} />}
      </main>
    </>
  );
}
