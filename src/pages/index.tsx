import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import { type RouterOutputs, api } from "~/utils/api";
import { type SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";

// Components

const Spinner = () => {
  return (
    <svg
      aria-hidden="true"
      className="mr-2 h-20 w-20 animate-spin fill-[#D4A373] text-gray-200 dark:text-gray-600"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
  );
};

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

const NavButton: React.FC<{ label: string; child?: React.ReactNode }> = ({
  label,
  child,
}) => {
  return (
    <div className="mr-2 rounded-md bg-[#CCD5AE] px-4 py-2 text-xl">
      {child ? child : label}
    </div>
  );
};

const Header: React.FC = () => {
  type NavData = {
    id: string;
    label: string;
  };

  const navList: NavData[] = [
    {
      id: "feed",
      label: "Feed",
    },
    {
      id: "search",
      label: "Search",
    },
    {
      id: "mybooks",
      label: "My Books",
    },
    {
      id: "profile",
      label: "Profile",
    },
  ];

  const user = useUser();

  return (
    <header className="fixed top-0 flex h-20 w-full bg-[#FEFAE0] p-4 text-xl">
      <div className="text-4xl">The Global Library</div>
      <div className="flex-grow"></div>
      {navList.map((navItem) => (
        <NavButton label={navItem.label} key={navItem.id} />
      ))}
      <NavButton
        label=""
        child={
          <div>
            {!user.isSignedIn && <SignInButton />}
            {!!user.isSignedIn && <SignOutButton />}
          </div>
        }
      />
    </header>
  );
};

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
        <AddBook />

        {!isBookDataLoading && <MyBookList bookList={bookData} />}
      </main>
    </>
  );
}
