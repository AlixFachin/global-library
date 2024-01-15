import { useUser } from "@clerk/nextjs";
import Head from "next/head";
import { type RouterOutputs, api } from "~/utils/api";
import { type SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Header } from "~/components/header";
import Spinner from "~/components/spinner";

// Components

const AddBook = () => {
  type PersonalBook = {
    title: string;
    author: string;
  };

  const ctx = api.useContext();
  const { register, handleSubmit, reset: formReset } = useForm<PersonalBook>();
  const { mutate, isLoading: isPosting } = api.books.create.useMutation({
    onSuccess: async () => {
      formReset();
      console.log("Success in the mutation!");
      await ctx.books.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to post! Please retry later");
      console.log(error.data?.zodError?.fieldErrors.message);
    },
  });

  // in order to force refresh on post, we get the tRPC context

  const onSubmit: SubmitHandler<PersonalBook> = (data, event) => {
    event?.preventDefault();
    void mutate({
      title: data.title,
      author: data.author,
    });
  };

  if (isPosting) {
    return <Spinner />;
  }

  return (
    <section className="mb-4 flex w-full max-w-3xl flex-col rounded-lg bg-[#FAEDCD] p-4">
      <form onSubmit={() => handleSubmit(onSubmit)}>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-2 rounded-lg bg-[#FAEDCD] px-2 sm:grid-cols-2">
          <h2 className="col-span-2 mb-2 text-3xl">Add a book</h2>
          <label>Title</label>
          <input
            placeholder="My favourite book's title"
            {...register("title")}
            className="rounded-sm border-2 border-slate-300 bg-transparent px-2"
            disabled={isPosting}
          />
          <label>Author</label>
          <input
            placeholder="My favourite book's author"
            {...register("author")}
            className="rounded-sm border-2 border-slate-300 bg-transparent px-2"
            disabled={isPosting}
          />

          <div className="col-span-2 flex justify-center p-2">
            <input
              type="submit"
              className="bg-[#CCD5AE] px-4 py-2 text-xl"
              value="Save to DB"
              disabled={isPosting}
            />
          </div>
        </div>
      </form>
    </section>
  );
};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

type BookEnhanced = RouterOutputs["books"]["getAll"][number];

const BookCard: React.FC<BookEnhanced> = (props) => {
  const { book, firstOwner } = props;

  return (
    <div className="mb-2 flex w-full flex-col gap-4 border-[1px]">
      <div className="flex flex-wrap items-center gap-2 p-2">
        <Image
          src={firstOwner?.profileImageUrl}
          className="h-10 w-10 rounded-full"
          width={40}
          height={40}
          alt={`${firstOwner.username || "user"} profile picture`}
        />
        <span className="mr-2 text-lg">{book.title}</span>
        <span className="italic">({book.author})</span>
      </div>
    </div>
  );
};

const MyBookList: React.FC<{ bookList: BookEnhanced[] | undefined }> = ({
  bookList,
}) => {
  return (
    <section className="flex w-full max-w-3xl flex-col rounded-lg bg-[#FAEDCD] p-4">
      <h1 className="mb-2 text-3xl">My Books</h1>
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

// My Feed Page -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export default function MyFeed() {
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
        <AddBook />

        {!isBookDataLoading && <MyBookList bookList={bookData} />}
      </main>
    </>
  );
}
